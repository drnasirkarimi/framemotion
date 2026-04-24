import Types "../types/jobs";
import ConfigLib "../lib/config";

mixin (config : Types.ConfigState) {
  /// Admin: set the Replicate API key in stable storage.
  public shared ({ caller }) func setReplicateApiKey(key : Text) : async () {
    config.replicateApiKey := ?key;
  };

  /// Return current configuration (model id, version).
  public query func getConfig() : async Types.Config {
    ConfigLib.getConfig(config.modelId, config.modelVersion);
  };
};
