//Import React and useEffect, useState hooks
import React, { useEffect, useState } from "react";

//Create a custom component to display each item in the data
function Item({ rarity, description }) {
  return (
    <div className="item">
      <p className="rarity">{rarity}</p>
      <p className="description">{description}</p>
    </div>
  );
}

//Create a custom component to display each key and its array of items
function Key({ key, items }) {
  return (
    <div className="key">
      <h3 className="key-name">{key}</h3>
      <div className="items">
        {items.map((item) => (
          <Item key={item.rarity} {...item} />
        ))}
      </div>
    </div>
  );
}

//Create the main component that will fetch and display the data
function App() {
  //Use state to store the data
  const [data, setData] = useState(null);

  //Use effect to fetch the data once the component mounts
  useEffect(() => {
    //Use the fetch API to get the data from "/pp"
    fetch("/pp")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error(error));
  }, []);

  //Return a loading message if the data is not ready
  if (!data) {
    return <p>Loading...</p>;
  }

  //Return a JSX element that displays the data in a JSON-like structure
  return (
    <div className="app">
      <h1>Data from /pp</h1>
      <div className="data">
        {Object.entries(data).map(([key, items]) => (
          //Remove the duplicate key attribute
          <Key key={key} items={items} />
        ))}
      </div>
    </div>
  );
}

//Export the App component
export default App;
