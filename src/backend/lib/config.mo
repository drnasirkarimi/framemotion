import Types "../types/jobs";

module {
  public func defaultConfig() : Types.Config {
    {
      modelId = "stability-ai/stable-video-diffusion";
      modelVersion = "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438";
    };
  };

  public func getConfig(
    modelId : Text,
    modelVersion : Text,
  ) : Types.Config {
    { modelId; modelVersion };
  };
};
