import React, { useEffect, useState } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { API } from 'aws-amplify'


const query = `
  query listNotes {
    listNotes {
      id name completed
    }
  }
`


const deleteTodo = `
  mutation deleteNote($noteId: String!){
    deleteNote(noteId: $noteId) 
  }
  `
const subscription = `
  subscription onCreateNote {
    onCreateNote {
      id name completed
    }
  }
  `
export default function TaskList() {

  const [animate, setanimate] = useState(false)

  async function deleteNote(id) {
    setanimate(true);
    await API.graphql({
      query: deleteTodo,
      variables: { noteId: id }
    })
    await fetchNotes();
    setanimate(false);
  }

  function subscribe() {
    API.graphql({
      query: subscription
    })
      .subscribe({
        next: noteData => {
          fetchNotes();
        }
      })
  }

  const [todo, setTodo] = useState()


  async function fetchNotes() {
    const data = await API.graphql({ query })
    setTodo(data);
  }
  subscribe()

  useEffect(() => {
    fetchNotes();
  }, []);

  if (!todo)
    return <div>Loading...</div>

  if (animate)
    return <div>Please wait...</div>

  return (
    <List className="List">

      {todo.data.listNotes.map(todo => {
        return (

          <ListItem role={undefined} dense button className="List">
            <ListItemIcon key={(todo.id)}>
              <Checkbox
                edge="start"
                tabIndex={-1}
                disableRipple

              />
            </ListItemIcon>
            <ListItemText id={todo.id} primary={todo.name} />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="comments" onClick={() => deleteNote(todo.id)} className="Delete">
                <DeleteIcon color="pink" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        )
      })}
    </List>
  )
}