import Map "mo:core/Map";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/jobs";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type JobMap = Map.Map<Common.JobId, Types.Job>;

  public func createJob(
    jobs : JobMap,
    counter : Types.JobsCounterState,
    caller : Common.UserId,
    inputImage : Storage.ExternalBlob,
    inputImageUrl : Text,
    motionIntensity : Nat,
  ) : Types.Job {
    let id = counter.nextId.toText();
    counter.nextId += 1;
    let now = Time.now();
    let job : Types.Job = {
      id;
      userId = caller;
      status = #queued;
      motionIntensity;
      inputImage;
      inputImageUrl;
      outputVideoUrl = null;
      errorMsg = null;
      createdAt = now;
      updatedAt = now;
      replicateId = null;
    };
    jobs.add(id, job);
    job;
  };

  public func getJob(jobs : JobMap, jobId : Common.JobId) : ?Types.Job {
    jobs.get(jobId);
  };

  public func listJobs(
    jobs : JobMap,
    filter : ?Types.JobStatus,
    limit : Nat,
    offset : Nat,
  ) : Types.JobListResult {
    let all = jobs.values()
      .filter(func(j : Types.Job) : Bool {
        switch (filter) {
          case null true;
          case (?s) (j.status == s);
        };
      })
      .sort(func(a : Types.Job, b : Types.Job) : { #less; #equal; #greater } {
        // sort descending by createdAt (most recent first)
        if (a.createdAt > b.createdAt) #less
        else if (a.createdAt < b.createdAt) #greater
        else #equal;
      })
      .toArray();

    let total = all.size();
    let sliced = all.values()
      .drop(offset)
      .take(limit)
      .toArray();

    { jobs = sliced; total };
  };

  public func updateJobStatus(
    jobs : JobMap,
    jobId : Common.JobId,
    status : Types.JobStatus,
    outputVideoUrl : ?Text,
    errorMsg : ?Text,
  ) : Bool {
    switch (jobs.get(jobId)) {
      case null false;
      case (?existing) {
        let updated = {
          existing with
          status;
          outputVideoUrl;
          errorMsg;
          updatedAt = Time.now();
        };
        jobs.add(jobId, updated);
        true;
      };
    };
  };

  public func deleteJob(jobs : JobMap, jobId : Common.JobId) : Bool {
    switch (jobs.get(jobId)) {
      case null false;
      case _ {
        jobs.remove(jobId);
        true;
      };
    };
  };

  public func setReplicateId(jobs : JobMap, jobId : Common.JobId, replicateId : Text) : Bool {
    switch (jobs.get(jobId)) {
      case null false;
      case (?existing) {
        let updated = {
          existing with
          replicateId = ?replicateId;
          status = #processing;
          updatedAt = Time.now();
        };
        jobs.add(jobId, updated);
        true;
      };
    };
  };
};
