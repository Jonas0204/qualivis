import React from 'react';
import { connect } from 'react-redux';
import TodoItem from './TodoItem';

const TodoList = ({ todos, onReset }) => {
  const sorted = [...todos].sort((a, b) => a.id - b.id);
  return (
    <>
      <ul>
        {sorted.map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
      <button onClick={onReset}>Reset</button>
    </>
  );
};

const mapStateToProps = state => ({ todos: state.todos });

const ConnectedTodoList = connect(mapStateToProps)(TodoList);

export default ConnectedTodoList;
