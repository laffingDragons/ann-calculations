import React, { useState, useEffect } from 'react';
import './index.css';

const Neuron = ({ x, y, value, label, color }) => (
  <g>
    <circle
      cx={x}
      cy={y}
      r="30"
      fill={color}
      stroke="#666"
      className="neuron-circle"
    />
    <text
      x={x}
      y={y - 5}
      className="neuron-text"
    >
      {label}
    </text>
    <text
      x={x}
      y={y + 10}
      className="neuron-text"
    >
      {typeof value === 'number' ? value.toFixed(4) : value}
    </text>
  </g>
);

const Connection = ({ from, to, weight }) => {
  const [hover, setHover] = useState(false);
  return (
    <g 
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)}
    >
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={hover ? "#000" : "#ccc"}
        strokeWidth={hover ? "2" : "1"}
        className="connection-line"
      />
      {hover && (
        <text
          x={(from.x + to.x) / 2}
          y={(from.y + to.y) / 2 - 5}
          className="connection-text"
        >
          W={weight?.toFixed(2)}
        </text>
      )}
    </g>
  );
};

const NetworkConfig = ({ config, setConfig }) => {
  const handleLayerChange = (index, neurons) => {
    const newLayers = [...config.hiddenLayers];
    newLayers[index] = parseInt(neurons) || 1;
    setConfig({ ...config, hiddenLayers: newLayers });
  };

  return (
    <div className="network-config">
      <div className="grid-container grid-2">
        <div className="input-group">
          <label className="input-label">Input Neurons</label>
          <input
            type="number"
            min="1"
            value={config.inputNeurons}
            onChange={(e) => setConfig({...config, inputNeurons: parseInt(e.target.value) || 1})}
            className="input-field"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Output Neurons</label>
          <input
            type="number"
            min="1"
            value={config.outputNeurons}
            onChange={(e) => setConfig({...config, outputNeurons: parseInt(e.target.value) || 1})}
            className="input-field"
          />
        </div>
      </div>

      <div className="hidden-layers">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Hidden Layers</h3>
          <button
            onClick={() => setConfig({...config, hiddenLayers: [...config.hiddenLayers, 1]})}
            className="button button-blue"
          >
            Add Layer
          </button>
        </div>
        {config.hiddenLayers.map((neurons, index) => (
          <div key={index} className="layer-row">
            <span className="input-label">Layer {index + 1}</span>
            <input
              type="number"
              min="1"
              value={neurons}
              onChange={(e) => handleLayerChange(index, e.target.value)}
              className="input-field"
              style={{ width: '100px' }}
            />
            <button
              onClick={() => {
                const newLayers = config.hiddenLayers.filter((_, i) => i !== index);
                setConfig({...config, hiddenLayers: newLayers});
              }}
              className="button button-red"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const NetworkVisualizer = ({ config, inputs, weights, results }) => {
  const layerSpacing = 180;
  const neuronSpacing = 100;
  const xStart = 50;
  const yStart = 50;

  const getLayerPositions = () => {
    const positions = [];
    let x = xStart;

    // Input layer
    positions.push(
      Object.entries(inputs).map(([key, value], i) => ({
        id: key,
        x,
        y: yStart + i * neuronSpacing,
        value
      }))
    );

    // Hidden layers
    for (let l = 0; l < config.hiddenLayers.length; l++) {
      x += layerSpacing;
      const layer = [];
      for (let n = 0; n < config.hiddenLayers[l]; n++) {
        layer.push({
          id: `h${l}_${n}`,
          x,
          y: yStart + n * neuronSpacing,
          value: results.hidden[l]?.[n] || 0
        });
      }
      positions.push(layer);
    }

    // Output layer
    x += layerSpacing;
    positions.push(
      Array(config.outputNeurons).fill(0).map((_, i) => ({
        id: `out${i}`,
        x,
        y: yStart + i * neuronSpacing,
        value: results.outputs[i] || 0
      }))
    );

    return positions;
  };

  const layerPositions = getLayerPositions();
  const height = Math.max(...layerPositions.map(layer => layer.length)) * neuronSpacing + 100;
  const width = (layerPositions.length - 1) * layerSpacing + 200;

  return (
    <svg width={width} height={height} className="network-visualization">
      {/* Draw connections */}
      {layerPositions.slice(0, -1).map((layer, layerIndex) =>
        layer.map((neuron, neuronIndex) =>
          layerPositions[layerIndex + 1].map((nextNeuron, nextIndex) => (
            <Connection
              key={`${neuron.id}-${nextNeuron.id}`}
              from={neuron}
              to={nextNeuron}
              weight={weights[`W${layerIndex * layer.length + nextIndex + 1}`]}
            />
          ))
        )
      )}

      {/* Draw neurons */}
      {layerPositions.map((layer, layerIndex) =>
        layer.map((neuron) => (
          <Neuron
            key={neuron.id}
            x={neuron.x}
            y={neuron.y}
            label={neuron.id}
            value={neuron.value}
            color={`hsl(${layerIndex * 45}, 70%, 90%)`}
          />
        ))
      )}
    </svg>
  );
};

const DynamicANNCalculator = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [networkConfig, setNetworkConfig] = useState({
    inputNeurons: 5,
    hiddenLayers: [4, 3, 2, 3],
    outputNeurons: 1
  });
  
  const [inputs, setInputs] = useState({});
  const [weights, setWeights] = useState({});
  const [results, setResults] = useState({
    hidden: [],
    outputs: []
  });

  useEffect(() => {
    const newInputs = {};
    for (let i = 1; i <= networkConfig.inputNeurons; i++) {
      newInputs[`X${i}`] = i * 10;
    }
    setInputs(newInputs);

    const newWeights = {};
    let weightCount = 1;
    for (let i = 0; i < networkConfig.hiddenLayers.length + 1; i++) {
      const layerSize = i < networkConfig.hiddenLayers.length 
        ? networkConfig.hiddenLayers[i] 
        : networkConfig.outputNeurons;
      const prevSize = i === 0 
        ? networkConfig.inputNeurons 
        : networkConfig.hiddenLayers[i - 1];
      
      for (let j = 0; j < prevSize * layerSize; j++) {
        newWeights[`W${weightCount}`] = weightCount;
        weightCount++;
      }
    }
    setWeights(newWeights);
  }, [networkConfig]);

  const sigmoid = (x) => 1 / (1 + Math.exp(-x));

  const calculateNetwork = () => {
    const hiddenResults = [];
    let prevLayer = Object.values(inputs);
    let weightIndex = 1;

    // Calculate hidden layers
    for (const layerSize of networkConfig.hiddenLayers) {
      const layerResults = [];
      for (let i = 0; i < layerSize; i++) {
        let sum = 0;
        for (let j = 0; j < prevLayer.length; j++) {
          sum += prevLayer[j] * weights[`W${weightIndex++}`];
        }
        layerResults.push(sigmoid(sum + 0.1));
      }
      hiddenResults.push(layerResults);
      prevLayer = layerResults;
    }

    // Calculate output layer
    const outputResults = [];
    for (let i = 0; i < networkConfig.outputNeurons; i++) {
      let sum = 0;
      for (let j = 0; j < prevLayer.length; j++) {
        sum += prevLayer[j] * weights[`W${weightIndex++}`];
      }
      outputResults.push(sigmoid(sum + 0.1));
    }

    setResults({
      hidden: hiddenResults,
      outputs: outputResults
    });
  };

  useEffect(() => {
    calculateNetwork();
  }, [inputs, weights]);

  return (
    <div className="calculator-container">
      <div className="tab-container">
        <button 
          className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          Network Configuration
        </button>
        <button 
          className={`tab-button ${activeTab === 'inputs' ? 'active' : ''}`}
          onClick={() => setActiveTab('inputs')}
        >
          Inputs
        </button>
        <button 
          className={`tab-button ${activeTab === 'weights' ? 'active' : ''}`}
          onClick={() => setActiveTab('weights')}
        >
          Weights
        </button>
        <button 
          className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
      </div>

      {activeTab === 'config' && (
        <NetworkConfig config={networkConfig} setConfig={setNetworkConfig} />
      )}

      {activeTab === 'inputs' && (
        <div className="grid-container grid-5">
          {Object.entries(inputs).map(([key, value]) => (
            <div key={key} className="input-group">
              <label className="input-label">{key}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setInputs(prev => ({
                  ...prev, 
                  [key]: parseFloat(e.target.value) || 0
                }))}
                className="input-field"
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'weights' && (
        <div className="grid-container grid-6">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} className="input-group">
              <label className="input-label">{key}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setWeights(prev => ({
                  ...prev, 
                  [key]: parseFloat(e.target.value) || 0
                }))}
                className="input-field"
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="network-visualization">
          <NetworkVisualizer 
            config={networkConfig}
            inputs={inputs}
            weights={weights}
            results={results}
          />
        </div>
      )}
    </div>
  );
};

export default DynamicANNCalculator;