// eslint-disable-next-line
import "es6-shim";
import "raf/polyfill";
import "core-js/fn/symbol/iterator";
import "core-js/es6/symbol";
import "core-js/fn/object/entries";
import "core-js/fn/object/values";
import "./index.scss";
import { BrowserRouter, Route } from "react-router-dom";

import React from "react";
import ReactDOM from "react-dom";
import { gapi } from "./analytics/ga";
import AppContainer from "./AppContainer";
import PropTypes from "prop-types";

class GAListener extends React.Component {
  static contextTypes = {
    router: PropTypes.object
  };

  componentDidMount() {
    this.sendPageView(this.context.router.history.location);
    this.context.router.history.listen(this.sendPageView);
  }

  sendPageView(location) {
    // Send pageview event to the initialised tracker(s).
    gapi.pageview(location.pathname);
  }

  render() {
    return this.props.children;
  }
}

ReactDOM.render(
  <BrowserRouter>
    <GAListener>
      <ScrollToTop>
        <Route path="/" component={AppContainer} />
      </ScrollToTop>
    </GAListener>
  </BrowserRouter>,
  document.getElementById("root")
);
