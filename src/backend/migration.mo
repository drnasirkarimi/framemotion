import Map "mo:core/Map";
import Common "./types/common";
import Types "./types/jobs";

module {
  // ─── Old types (copied from .old/src/backend/types/jobs.mo) ───────────────

  type OldJobStatus = {
    #queued;
    #processing;
    #completed;
    #failed;
  };

  type OldJob = {
    id : Common.JobId;
    userId : Common.UserId;
    status : OldJobStatus;
    motionIntensity : Nat;
    inputImage : Blob;
    outputVideoUrl : ?Text;
    errorMsg : ?Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
    replicateId : ?Text;
  };

  type OldConfigState = {
    var replicateApiKey : ?Text;
    var modelId : Text;
    var modelVersion : Text;
  };

  type OldJobsCounterState = {
    var nextId : Nat;
  };

  type OldActor = {
    jobs : Map.Map<Common.JobId, OldJob>;
    counter : OldJobsCounterState;
    config : OldConfigState;
  };

  // ─── New types ─────────────────────────────────────────────────────────────

  type NewActor = {
    jobs : Map.Map<Common.JobId, Types.Job>;
    counter : Types.JobsCounterState;
    config : Types.ConfigState;
  };

  // ─── Migration ─────────────────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    // Migrate each job to add the new inputImageUrl field (default empty string
    // since old jobs were created before the URL was tracked).
    let newJobs = old.jobs.map<Common.JobId, OldJob, Types.Job>(
      func(_id, oldJob) {
        { oldJob with inputImageUrl = "" };
      }
    );
    {
      jobs = newJobs;
      counter = old.counter;
      config = old.config;
    };
  };
};
