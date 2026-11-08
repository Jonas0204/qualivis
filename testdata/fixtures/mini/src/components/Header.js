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
