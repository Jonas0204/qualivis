import React from 'react';

export default class BaseWidget extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps !== this.props;
  }

  render() {
    return null;
  }
}
