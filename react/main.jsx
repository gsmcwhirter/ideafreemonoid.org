var React = require('react');
var ReactDOM = require('react-dom');
var EventEmitter = require('fbemitter').EventEmitter;
var _ = require("underscore");

var Router = require('react-router').Router;
var Route = require('react-router').Route;
var IndexRoute = require('react-router').IndexRoute;
var browserHistory = require("react-router").browserHistory;

var Menu = require('./menu.jsx');
var SideBar = require('./sidebar.jsx');

var Page = require('./page.jsx');
var Portfolio = require('./portfolio.jsx');

var PageTitleEmitter = new EventEmitter();

var wrapComponent = function(Component, props) {
  return React.createClass({
    render: function() {
      return React.createElement(Component, _.assign({}, this.props, props), this.props.children);
    }
  });
};

var components = {
    "home": {actual: Page, pageName: "home"},
    "portfolio": {actual: Portfolio},
    "404": {actual: Page, pageName: "error404"}
};

var PageTitle = React.createClass({
    getInitialState: function (){
        return {pagetitle: this.props.initialTitle};
    },
    componentDidMount: function (){
        this.PageTitleEmitter = this.props.emitter;
        this.PageTitleEmitter.addListener("titleChange", this.changeTitle);
        console.log("Set listener...");
    },
    changeTitle: function (newTitle)
    {
        console.log("Changing title...");
        this.setState({pagetitle: newTitle});
    },
    render: function (){
        return <h1>IdeaFreeMonoid&nbsp;-&nbsp;<span id="pagetitle">{this.state.pagetitle}</span></h1>;
    }
});

var App = React.createClass({
    render: function (){
        return (
          <div>
          <header id="header">
              <PageTitle emitter={PageTitleEmitter} />
          </header>
          {this.props.menu || <Menu />}
          {this.props.children}
          </div>
        );
    }
});

var AppWrapper = React.createClass({
  getInitialState: function (){
    return {paths: [{path: "/", component: "home"}, {path: "/portfolio", component: "portfolio"}]};
  },
  componentDidMount: function (){
    // this.serverRequest = $.get("/api/v1/page/"+this.props.page, function (result){
    //     //when done fetching
    //     this.setState(result);
    // }.bind(this));
  },
  componentWillUnmount: function (){
    // this.serverRequest.abort();
  },
  render: function (){
    return (
      <Router history={browserHistory}>
        <Route path="/" component={App}>
          <IndexRoute component={wrapComponent(components.home.actual, {emitter: PageTitleEmitter, pageName: "home"})} />
          {this.state.paths.filter(function (path){
            return path.path !== "" && path.path !== "/";
          }).map(function (path){
            return <Route key={path.path} path={path.path} component={wrapComponent((components[path.component] || components["404"]).actual, {emitter: PageTitleEmitter, pageName: components[path.component].pageName})}></Route>;
          })}
        </Route>
      </Router>
    );
  }
});



ReactDOM.render(<AppWrapper />, document.getElementById('content'));
ReactDOM.render(<SideBar />, document.getElementById('sidebar'));
