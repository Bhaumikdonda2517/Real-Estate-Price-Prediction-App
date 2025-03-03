import React, { useState, useEffect } from "react";
import { NeuralNetwork } from "brain.js";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const App = () => {
    // ✅ State for form inputs, predictions, and model training
    const [formData, setFormData] = useState({
        area: "",
        bedrooms: "",
        bathrooms: "",
        location: "",
        age: ""
    });

    const [trainedNet, setTrainedNet] = useState(null);
    const [predictedPrice, setPredictedPrice] = useState(null);
    const [data, setData] = useState([]);
    const [chartData, setChartData] = useState(null);

    // ✅ Load model from LocalStorage or train a new model
    useEffect(() => {
        const storedModel = localStorage.getItem("trainedModel");

        if (storedModel) {
            console.log("📌 Loading model from LocalStorage...");
            const net = new NeuralNetwork();
            net.fromJSON(JSON.parse(storedModel));
            setTrainedNet(net);
        } else {
            fetch("/real_estate_data.json")
                .then(response => response.json())
                .then(responseData => {
                    setData(responseData);
                    trainModel(responseData);
                })
                .catch((error) => console.error("❌ Error loading data:", error));
        }
    }, []);

    // ✅ Train the Neural Network
    const trainModel = (dataset) => {
        console.log("📌 Training Model with Data:", dataset);

        const net = new NeuralNetwork({ hiddenLayers: [5, 3] });

        const formattedData = dataset.map(item => ({
            input: {
                area: item["Area (sq ft)"] / 10000,
                bedrooms: item.Bedrooms / 10,
                bathrooms: item.Bathrooms / 10,
                location: item.Location / 5,
                age: item["Age of Property (years)"] / 100
            },
            output: { price: item["Price (in $1000)"] / 1000 }
        }));

        net.train(formattedData, { iterations: 2000, errorThresh: 0.005 });

        console.log("✅ Model Training Completed");

        // ✅ Save trained model in LocalStorage
        localStorage.setItem("trainedModel", JSON.stringify(net.toJSON()));

        setTrainedNet(net);
    };

    // ✅ Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ✅ Predict property price & update chart
    const handlePredict = () => {
        if (!trainedNet) {
            console.error("❌ Model is not trained yet.");
            alert("Model is not trained yet. Please train it first.");
            return;
        }

        const input = {
            area: parseFloat(formData.area) / 10000,
            bedrooms: parseFloat(formData.bedrooms) / 10,
            bathrooms: parseFloat(formData.bathrooms) / 10,
            location: parseFloat(formData.location) / 5,
            age: parseFloat(formData.age) / 100
        };

        console.log("📌 User Input:", input);

        const output = trainedNet.run(input);

        console.log("📌 Raw Prediction Output:", output);

        if (output && output.price) {
            const predicted = output.price * 1000;
            setPredictedPrice(predicted);
            console.log("✅ Predicted Price:", predicted);

            // ✅ Update Chart Data
            setChartData({
                labels: ["Actual Price", "Predicted Price"],
                datasets: [
                    {
                        label: "Price ($1000s)",
                        data: [
                            data.length > 0 ? data[0]["Price (in $1000)"] : 0, // Example actual price
                            predicted
                        ],
                        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"]
                    }
                ]
            });
        } else {
            console.error("❌ Prediction failed: No output from model.");
            alert("Prediction failed. Please check your input values.");
        }
    };

    // ✅ Clear stored model
    const clearModel = () => {
        localStorage.removeItem("trainedModel");
        setTrainedNet(null);
        console.log("🚀 Model cleared from LocalStorage.");
        alert("Trained model has been removed. Please refresh the page to retrain.");
    };

    return (
        <div className="container text-center mt-5">
            <h1 className="text-white mb-4"> Real Estate Price Prediction</h1>

            <div className="card p-4 shadow-lg">
                <form className="mb-3">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="area" className="text-white">Area (sq ft)</label>
                                <input type="number" className="form-control mb-3" name="area" placeholder="Enter area in sq ft" onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bedrooms" className="text-white">Bedrooms</label>
                                <input type="number" className="form-control mb-3" name="bedrooms" placeholder="Enter number of bedrooms" onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bathrooms" className="text-white">Bathrooms</label>
                                <input type="number" className="form-control mb-3" name="bathrooms" placeholder="Enter number of bathrooms" onChange={handleChange} />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="location" className="text-white">Location (Encoded)</label>
                                <input type="number" className="form-control mb-3" name="location" placeholder="Enter encoded location" onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="age" className="text-white">Age of Property</label>
                                <input type="number" className="form-control mb-3" name="age" placeholder="Enter age of property" onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <button type="button" className="btn btn-success w-100" onClick={handlePredict}>
                        Predict Price
                    </button>
                </form>

                {predictedPrice && <h2 className="text-success mt-3">Predicted Price: ${predictedPrice.toFixed(2)}</h2>}

                {chartData && (
                    <div className="mt-4">
                        <h3 className="text-primary">📊 Prediction Comparison</h3>
                        <div style={{ width: "500px", margin: "auto" }}>
                            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>
                )}

                <button type="button" className="btn btn-danger mt-3" onClick={clearModel}>
                    Clear Stored Model
                </button>
            </div>
        </div>
    );
};

export default App;