import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Common "../types/common";
import Types "../types/jobs";
import JobsLib "../lib/jobs";
import Storage "mo:caffeineai-object-storage/Storage";

mixin (
  jobs : Map.Map<Common.JobId, Types.Job>,
  counter : Types.JobsCounterState,
  config : Types.ConfigState,
) {
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  /// Create a new video generation job.
  /// inputImage: raw image bytes stored in the job record.
  /// inputImageUrl: publicly accessible image URL (or data URI) sent to Replicate.
  /// motionIntensity: 1–10 scale controlling animation strength.
  public shared ({ caller }) func createJob(
    inputImage : Storage.ExternalBlob,
    inputImageUrl : Text,
    motionIntensity : Nat,
  ) : async Common.JobId {
    let apiKey = switch (config.replicateApiKey) {
      case null Runtime.trap("Replicate API key not configured. Please set your API key first.");
      case (?k) {
        if (k.size() == 0) Runtime.trap("Replicate API key is empty. Please set a valid API key.");
        k;
      };
    };

    // Create job record in queued state
    let job = JobsLib.createJob(jobs, counter, caller, inputImage, inputImageUrl, motionIntensity);

    // Map motionIntensity (1-10) to motion_bucket_id (100-200)
    let clampedIntensity = if (motionIntensity < 1) 1 else if (motionIntensity > 10) 10 else motionIntensity;
    let motionBucketId = 100 + (clampedIntensity - 1) * 11;

    // Build Replicate API request body per https://api.replicate.com/v1/predictions
    let requestBody = "{\"version\":\"" # config.modelVersion # "\",\"input\":{\"image\":\"" # inputImageUrl # "\",\"motion_bucket_id\":" # motionBucketId.toText() # ",\"fps_id\":25,\"decoding_t\":14}}";

    let headers : [OutCall.Header] = [
      { name = "Authorization"; value = "Bearer " # apiKey },
      { name = "Content-Type"; value = "application/json" },
    ];

    let responseText = await OutCall.httpPostRequest(
      "https://api.replicate.com/v1/predictions",
      headers,
      requestBody,
      transform,
    );

    // Parse replicateId from response JSON: finds "id":"<value>"
    let replicateId = extractJsonStringField(responseText, "id");
    switch (replicateId) {
      case (?rid) {
        ignore JobsLib.setReplicateId(jobs, job.id, rid);
      };
      case null {
        ignore JobsLib.updateJobStatus(jobs, job.id, #failed, null, ?("Failed to parse Replicate prediction ID. Response: " # responseText));
      };
    };

    job.id;
  };

  /// Retrieve a job by ID. Returns null if not found.
  public query func getJob(jobId : Common.JobId) : async ?Types.Job {
    JobsLib.getJob(jobs, jobId);
  };

  /// List jobs with optional status filter, pagination.
  public query func listJobs(
    filter : ?Types.JobStatus,
    limit : Nat,
    offset : Nat,
  ) : async Types.JobListResult {
    JobsLib.listJobs(jobs, filter, limit, offset);
  };

  /// Update job status — callable by frontend after polling Replicate.
  public shared ({ caller }) func updateJobStatus(
    jobId : Common.JobId,
    status : Types.JobStatus,
    outputVideoUrl : ?Text,
    errorMsg : ?Text,
  ) : async () {
    ignore JobsLib.updateJobStatus(jobs, jobId, status, outputVideoUrl, errorMsg);
  };

  /// Delete a job and its associated metadata.
  public shared ({ caller }) func deleteJob(jobId : Common.JobId) : async Bool {
    JobsLib.deleteJob(jobs, jobId);
  };

  /// Poll Replicate API for prediction status and update the local job record.
  public shared func pollReplicateJob(jobId : Common.JobId) : async () {
    let apiKey = switch (config.replicateApiKey) {
      case null Runtime.trap("Replicate API key not configured");
      case (?k) k;
    };

    let job = switch (JobsLib.getJob(jobs, jobId)) {
      case null Runtime.trap("Job not found");
      case (?j) j;
    };

    let rid = switch (job.replicateId) {
      case null Runtime.trap("No Replicate prediction ID for this job");
      case (?r) r;
    };

    let headers : [OutCall.Header] = [
      { name = "Authorization"; value = "Bearer " # apiKey },
    ];

    let url = "https://api.replicate.com/v1/predictions/" # rid;
    let responseText = await OutCall.httpGetRequest(url, headers, transform);

    let statusField = extractJsonStringField(responseText, "status");
    switch (statusField) {
      case (?"succeeded") {
        let outputUrl = extractJsonArrayFirstString(responseText, "output");
        ignore JobsLib.updateJobStatus(jobs, jobId, #completed, outputUrl, null);
      };
      case (?"failed") {
        let errDetail = extractJsonStringField(responseText, "error");
        ignore JobsLib.updateJobStatus(jobs, jobId, #failed, null, errDetail);
      };
      case (?"starting") {
        ignore JobsLib.updateJobStatus(jobs, jobId, #processing, null, null);
      };
      case (?"processing") {
        ignore JobsLib.updateJobStatus(jobs, jobId, #processing, null, null);
      };
      case _ {};
    };
  };

  // ─── JSON helpers ─────────────────────────────────────────────────────────

  // Extract a string value from JSON: finds `"key":"value"` and returns value
  private func extractJsonStringField(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\":\"";
    let afterNeedle = splitOnce(json, needle);
    switch (afterNeedle) {
      case null null;
      case (?rest) {
        ?takeUntilQuote(rest);
      };
    };
  };

  // Extract first string from a JSON array: finds `"key":["value1",...]` and returns value1
  private func extractJsonArrayFirstString(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\":[\"";
    let afterNeedle = splitOnce(json, needle);
    switch (afterNeedle) {
      case null null;
      case (?rest) {
        ?takeUntilQuote(rest);
      };
    };
  };

  // Returns the substring after the first occurrence of sep, or null if not found
  private func splitOnce(text : Text, sep : Text) : ?Text {
    var parts = text.split(#text sep).toArray();
    if (parts.size() < 2) return null;
    var result = parts[1];
    var i = 2;
    while (i < parts.size()) {
      result := result # sep # parts[i];
      i += 1;
    };
    ?result;
  };

  // Returns text up to (not including) the first quote character
  private func takeUntilQuote(text : Text) : Text {
    let parts = text.split(#text "\"").toArray();
    if (parts.size() == 0) return "";
    parts[0];
  };
};
