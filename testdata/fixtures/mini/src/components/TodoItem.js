import React from 'react';

export default function TodoItem({ todo }) {
  if (!todo) {
    return null;
  }
  return <li>{todo.title}</li>;
}
