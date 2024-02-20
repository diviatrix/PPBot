const { useState, useEffect } = React;

function fetchData() {
    fetch('/pp')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('table-body');
            tableBody.innerHTML = createTableHTML(data);
        })
        .catch(error => console.log(error));
}

function createTableHTML(data) {
    let tableHTML = '';
    tableHTML += '<tr>';
    for (const key in data[0]) {
        tableHTML += `<th style="border: 1px solid black; padding: 5px;">${key}</th>`;
    }
    tableHTML += '</tr>';

    data.forEach(item => {
        tableHTML += '<tr>';
        for (const key in item) {
            tableHTML += `<td style="border: 1px solid black; padding: 5px;">${item[key]}</td>`;
        }
        tableHTML += '</tr>';
    });

    return tableHTML;
}

function App() {
    const [newPP, setNewPP] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddPP = () => {
        // Add logic to handle adding new PP
        // You can use the 'newPP' state variable to access the value entered by the user
        // For example, you can send a POST request to the server to add the new PP
        console.log('New PP:', newPP);
    };

    return (
        <div>
            <div>
                <input type="number" placeholder="ID" value={newPP.id} onChange={e => setNewPP({ ...newPP, id: e.target.value })} />
            </div>
            <div>
                <input type="text" placeholder="Description" value={newPP.description} onChange={e => setNewPP({ ...newPP, description: e.target.value })} />
            </div>
            <div>
                <select value={newPP.rarity} onChange={e => setNewPP({ ...newPP, rarity: e.target.value })}>
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                </select>
            </div>
            <button onClick={handleAddPP}>Add PP</button>
            <div>
            <table>
                <tbody id="table-body"></tbody>
            </table>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));