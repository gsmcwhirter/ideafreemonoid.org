var React = require('react');
var marked = require('marked');

var CVCategory = React.createClass({
  rawMarkup: function() {
      var rawMarkup = marked(this.props.cvContent, {sanitize: true});
      return { __html: rawMarkup };
  },
  render: function (){
    return (
      <li>
        <h3>{this.props.name}</h3>
        <div className="cv-section-content" dangerouslySetInnerHTML={this.rawMarkup()}></div>
        <div className="cv-section-updated">Last updated {this.props.updated}</div>
      </li>
    );
  }
});

var CV = React.createClass({
  getInitialState: function (){
    return {categories: [{name: "Education", cvContent: "", updated: ""}]};
  },
  componentDidMount: function (){
    this.props.emitter.emit("titleChange", "CV");
    // this.serverRequest = $.get("/api/v1/page/"+this.props.page, function (result){
    //     //when done fetching
    //     this.setState(result);
    // }.bind(this));
  },
  componentWillUnmount: function(){
    // this.serverRequest.abort();
  },
  render: function (){
    return (
      <ol className="cvsections">
        {this.state.categories.map(function (category){
          return <CVCategory key={category.name} {...category} />;
        })}
      </ol>
    );
  }
});

module.exports = CV;
