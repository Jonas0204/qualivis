# A3 – Testprojekt `mini` (verbatim übernehmen)

Ablage: `testdata/fixtures/mini/`. Die Dateien sind **exakt** so anzulegen (inkl. Leerzeilen und
Zeilenenden LF), weil Zeilennummern und Metriken in die Golden-Daten eingehen. Nach dem Anlegen
`.gitattributes` mit `testdata/** -text` prüfen (P02-S02), damit Git keine Zeilenenden ändert.

Abgedeckte Erkennungsfälle: Klassenkomponente (`Component`), Vererbung von eigener Basisklasse,
`React.Component` als Member, Lifecycle inkl. veralteter Methode, `bind`-Alias im Konstruktor,
Funktion im Konstruktor (`this.helper = function`), Arrow-Klassen-Property, Pipe-Alias
(`onReset = () => this.handleIncrement()`), Getter (ignoriert), leere Methode, Methode ohne `this`,
Methode mit JSX, Funktionskomponente als Deklaration (TSX, Hooks, `useCallback`, innere Funktionen,
innere JSX-Funktion), Arrow-Komponente mit Fragment, `connect()(X)`, Funktionsausdruck-Komponente,
`React.lazy(() => import())`, Default-Export-Varianten, `*.test.js` (muss ignoriert werden).

## `src/App.js`
```jsx
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
```

## `src/base/BaseWidget.js`
```jsx
import React from 'react';

export default class BaseWidget extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps !== this.props;
  }

  render() {
    return null;
  }
}
```

## `src/components/Header.js`
```jsx
import React from 'react';
import BaseWidget from '../base/BaseWidget';

class Header extends BaseWidget {
  render() {
    const { title } = this.props;
    return (
      <header>
        <nav>
          <ul>
            <li>
              <span>{title}</span>
            </li>
          </ul>
        </nav>
      </header>
    );
  }
}

export default Header;
```

## `src/components/Counter.tsx`
```tsx
import React, { useCallback, useState } from 'react';

interface CounterProps {
  value: number;
  onIncrement: () => void;
}

export function Counter({ value, onIncrement }: CounterProps) {
  const [clicks, setClicks] = useState<number>(0);

  const handleClick = useCallback(() => {
    setClicks(clicks + 1);
    onIncrement();
  }, [clicks, onIncrement]);

  const formatValue = (input: number): string => {
    if (input < 0) {
      return 'negative';
    }
    return input > 100 ? 'many' : String(input);
  };

  const renderBadge = () => <span className="badge">{clicks}</span>;

  return (
    <button type="button" onClick={handleClick}>
      {formatValue(value)} {renderBadge()}
    </button>
  );
}
```

## `src/components/TodoList.jsx`
```jsx
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
```

## `src/components/TodoItem.js`
```jsx
import React from 'react';

export default function TodoItem({ todo }) {
  if (!todo) {
    return null;
  }
  return <li>{todo.title}</li>;
}
```

## `src/components/Footer.js`
```jsx
import React from 'react';

const Footer = function () {
  const year = 2026;
  return <footer>© {year}</footer>;
};

export default Footer;
```

## `src/utils.test.js`
```jsx
// Test files must be ignored by the analysis (isComponentFile).
import React from 'react';

export const Dummy = () => <div>ignored</div>;
```

## Keine weiteren Dateien im Fixture-Ordner

In `testdata/fixtures/mini/` liegen **nur** die acht Dateien oben (so wurde im Spike gearbeitet).
Die Beschreibung des Fixtures steht in `testdata/README.md`, nicht im Fixture-Ordner. Grund:
Jede Datei im Ordner landet im Manifest und damit in der Eingabe beider Systeme; Abweichungen
an dieser Stelle würden die Goldens verfälschen.
