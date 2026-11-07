import React, { Component } from 'react';
import Header from './components/Header';
import { Counter } from './components/Counter';
import TodoList from './components/TodoList';

const LazyFooter = React.lazy(() => import('./components/Footer'));

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0, todos: [] };
    this.handleIncrement = this.handleIncrement.bind(this);
    this.helper = function () {
      return 42;
    };
  }

  componentDidMount() {
    this.loadTodos();
  }

  componentWillMount() {
    this.prepare = true;
  }

  handleIncrement() {
    if (this.state.count > 10) {
      this.setState({ count: 0 });
    } else {
      this.setState({ count: this.state.count + 1 });
    }
  }

  loadTodos = () => {
    const todos = [1, 2, 3].map(id => ({ id, title: `Todo ${id}` }));
    this.setState({ todos });
  };

  onReset = () => this.handleIncrement();

  computeTotal() {
    let total = 0;
    for (let i = 0; i < 10; i++) {
      total += i % 2 === 0 ? i : -i;
    }
    return total;
  }

  emptyMethod() {}

  renderTitle() {
    return <h1>Title {this.state.count}</h1>;
  }

  get double() {
    return this.state.count * 2;
  }

  render() {
    return (
      <div className="app">
        <Header title="Mini" />
        {this.renderTitle()}
        <Counter value={this.state.count} onIncrement={this.handleIncrement} />
        <TodoList todos={this.state.todos} onReset={this.onReset} />
        <React.Suspense fallback={null}>
          <LazyFooter />
        </React.Suspense>
      </div>
    );
  }
}
