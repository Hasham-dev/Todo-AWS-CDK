import React, { useEffect, useState } from "react"
import "./style.css";
import shortId from "shortid";
import Navbar from "../components/NavBar";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import TaskList from "../components/TaskList";
import Container from '@material-ui/core/Container';
import { API } from 'aws-amplify'

const query = `
  query listNotes {
    listNotes {
      id name completed
    }
  }
`

const mutation = `
  mutation createNote($note: NoteInput!) {
    createNote(note: $note) {
      id name completed
    }
  }
`
export default function Home() {
  let inputText;

  
  

  async function createNote() {
    const id = shortId.generate();
    await API.graphql({
      query: mutation,
      variables: { note: { id: id, name: inputText.value, completed: false } }
    })
    inputText.value = "";
    fetchNotes()
  }



  const query = `
         query listNotes {
            listNotes {
             id name completed
    }
    }
    `

  async function fetchNotes() {
    const data = await API.graphql({ query })
  }

  return (<div>

    <Navbar />
    <Container maxWidth="sm" className="container">
      <label>
        <h1> Add Todo </h1>
        <input type="text" ref={node => {
          inputText = node;
        }} />
      </label><br />
      <Button variant="contained" style={{ color: "white" }} className="Add-Btn" onClick={createNote}>Add Todo</Button>

      <br /> <br />

      <h3> TODO LIST</h3>


      <TaskList  />

    </Container>
  </div>
  );

}
