import logo from './logo.svg';
import './App.css';
import DynamicANNCalculator from './DynamicANNCalculator';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <span>Artifical Neural Networks (Forward Propogation)</span>
      </header>
      <div className="main-container">
        <DynamicANNCalculator />
      </div>
    </div>
  );
}

export default App;
