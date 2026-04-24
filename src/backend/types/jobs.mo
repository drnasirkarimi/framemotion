import Common "../types/common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type JobStatus = {
    #queued;
    #processing;
    #completed;
    #failed;
  };

  public type Job = {
    id : Common.JobId;
    userId : Common.UserId;
    status : JobStatus;
    motionIntensity : Nat;
    inputImage : Storage.ExternalBlob;
    inputImageUrl : Text;
    outputVideoUrl : ?Text;
    errorMsg : ?Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
    replicateId : ?Text;
  };

  public type JobListResult = {
    jobs : [Job];
    total : Nat;
  };

  public type Config = {
    modelId : Text;
    modelVersion : Text;
  };

  /// Mutable config state passed to mixins so var fields can be updated in-place.
  public type ConfigState = {
    var replicateApiKey : ?Text;
    var modelId : Text;
    var modelVersion : Text;
  };

  /// Mutable jobs counter state passed to mixins so the counter can be incremented.
  public type JobsCounterState = {
    var nextId : Nat;
  };
};
