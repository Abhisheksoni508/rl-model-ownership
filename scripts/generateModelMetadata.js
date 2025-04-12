// scripts/generateModelMetadata.js

/**
 * Generates metadata for an RL model in the Gensyn RL Swarm
 * @param {Object} modelData - Model data
 * @returns {Object} - Model metadata object
 */
function generateModelMetadata(modelData) {
    const {
      modelName,
      description,
      algorithm,
      creator,
      creationDate,
      initialParams,
      architecture,
      trainingEnvironment,
      imageUrl
    } = modelData;
    
    return {
      name: modelName,
      description: description,
      image: imageUrl || "https://gensyn.ai/placeholder-model-image.png",
      attributes: [
        { trait_type: "Algorithm", value: algorithm },
        { trait_type: "Creator", value: creator },
        { trait_type: "Creation Date", value: creationDate },
        { trait_type: "Architecture", value: architecture },
        { trait_type: "Training Environment", value: trainingEnvironment }
      ],
      properties: {
        initialParameters: initialParams,
        initialPerformanceMetrics: {
          rewardRate: 0,
          completionRate: 0,
          contributionScore: 0
        }
      }
    };
  }
  
  // Example usage
  const sampleModelData = {
    modelName: "CartPole Solver v1",
    description: "An RL model trained to balance a pole on a moving cart",
    algorithm: "DQN",
    creator: "Alice",
    creationDate: "2025-04-12",
    initialParams: {
      learningRate: 0.001,
      discountFactor: 0.99,
      explorationRate: 0.1
    },
    architecture: "3-layer MLP (64, 64)",
    trainingEnvironment: "CartPole-v1",
    imageUrl: "https://example.com/cartpole.png"
  };
  
  const metadata = generateModelMetadata(sampleModelData);
  console.log(JSON.stringify(metadata, null, 2));
  
  module.exports = { generateModelMetadata };