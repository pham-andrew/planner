import './App.css';
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { Button } from '@mui/material';

async function getData() {
  const response = await fetch(`http://localhost:5000/obj/`, {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
  return response.json();
}

export default function App() {

  const [text, setText] = useState('Hello World!');
  const [textFieldInput, setSummary] = useState('');
  const [newPostWatcher, setNewPostWatcher] = useState(0);
  const handleTextField = (event) => setSummary(event.target.value);

  useEffect(() => {
    getData().then((data) => {
      setText(JSON.stringify(data));
    });
  }, [newPostWatcher]);

  const handlePost = async (text)=> {
    const response = await fetch(`http://localhost:5000/obj/create/`, {
        method: "POST",
        body: JSON.stringify({
          text: text
      }),
      headers: { "Content-Type": "application/json" },
    });
    setNewPostWatcher(newPostWatcher + 1);
    return response.json();
};

  return (
    <Box>
      <Typography>
        {text}
      </Typography>
      <TextField value={textFieldInput} onChange={handleTextField}/>
      <Button onClick={ () => {handlePost(textFieldInput)} }>Post</Button>
    </Box>
  );
}
