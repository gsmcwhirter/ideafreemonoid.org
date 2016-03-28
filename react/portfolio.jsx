var React = require('react');
var marked = require('marked');

var TechList = React.createClass({
    render: function (){
      return (
          <ul className="techlist">
            {this.props.techs.map(function (tech){
                return <li key={tech}>{tech}</li>;
            })}
          </ul>
      );
    }
});

var GitHubLink = React.createClass({
    render: function (){
      return <a href="https://www.github.com/{this.props.repo}">{this.props.repo}</a>;
    }
});

var DocsLink = React.createClass({
    render: function (){
      if (this.props.url){
        return <a href={this.props.url}></a>;
      }
      else{
        return;
      }
    }
});

var PortfolioItem = React.createClass({
    rawMarkup: function() {
        var rawMarkup = marked(this.props.item.about, {sanitize: true});
        return { __html: rawMarkup };
    },
    render: function (){
        return (
          <li>
            <h3>{this.props.item.name}</h3>
            <TechList techs={this.props.item.tech} />
            <GitHubLink repo={this.props.item.github} />
            <DocsLink url={this.props.item.docs} />
            <div className="about" dangerouslySetInnerHTML={this.rawMarkup()}></div>
          </li>
        );
    }
});

var Portfolio = React.createClass({
  getInitialState: function (){
      //return [{name: "", github: "", docs: "", live: "", tech: ["", ""], about: ""}];
      return {items: []};
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
          return <PortfolioItem item={item} />;
        })}
        </ol>
      );
  }
});

module.exports = Portfolio;
