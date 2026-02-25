// src/main.jsx

import React    from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import store    from "./app/store";
import App      from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1d26",
              color:      "#e2e8f0",
              border:     "1px solid #2a2d38",
              fontFamily: "DM Sans, sans-serif",
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);