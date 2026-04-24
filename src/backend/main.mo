import Map "mo:core/Map";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import JobsApi "mixins/jobs-api";
import ConfigApi "mixins/config-api";
import Common "types/common";
import Types "types/jobs";
import Migration "migration";

(with migration = Migration.run)
actor {
  // --- Stable state ---
  let jobs = Map.empty<Common.JobId, Types.Job>();

  let counter : Types.JobsCounterState = { var nextId = 0 };

  let config : Types.ConfigState = {
    var replicateApiKey = null;
    var modelId = "stability-ai/stable-video-diffusion";
    var modelVersion = "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438";
  };

  // --- Mixins ---
  include MixinObjectStorage();
  include JobsApi(jobs, counter, config);
  include ConfigApi(config);
};
