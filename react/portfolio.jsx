var React = require('react');
var marked = require('marked');

var TechList = React.createClass({
    render: function (){
      return (
          <ul className="techList">
            {this.props.techs.map(function (tech){
                return <li key={tech}>{tech}</li>;
            })}
          </ul>
      );
    }
});

var GitHubLink = React.createClass({
    render: function (){
      return <a className="githubLink" href="https://www.github.com/{this.props.repo}">{this.props.repo}</a>;
    }
});

var DocsLink = React.createClass({
    render: function (){
      if (this.props.url){
        return <a className="docsLink" href={this.props.url}>documentation</a>;
      }
      else {
        return;
      }
    }
});

var LiveLink = React.createClass({
  render: function (){
    if (this.props.url){
      return <a className="liveLink" href={this.props.url}>live example</a>;
    }
    else {
      return;
    }
  }
});

var PortfolioItem = React.createClass({
    rawMarkup: function() {
        var rawMarkup = marked(this.props.about, {sanitize: true});
        return { __html: rawMarkup };
    },
    render: function (){
        return (
          <li>
            <h3>{this.props.name}</h3>
            <TechList techs={this.props.tech} />
            <GitHubLink repo={this.props.github} />
            <DocsLink url={this.props.docs} />
            <LiveLink url={this.props.live} />
            <div className="about" dangerouslySetInnerHTML={this.rawMarkup()}></div>
          </li>
        );
    }
});

var Portfolio = React.createClass({
  getInitialState: function (){
      return {items: [{name: "Test", github: "gsmcwhirter/test", docs: "readthedocs/test", live: "yay", tech: ["C", "Python"], about: "Stuffy stuff stuff"}]};
      //return {items: []};
  },
  componentDidMount: function (){
      this.props.emitter.emit("titleChange", "Portfolio");
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
        <ol className="portfolioItems">
        {this.state.items.map(function (item){
          return <PortfolioItem key={item.name} {...item} />;
        })}
        </ol>
      );
  }
});

module.exports = Portfolio;
