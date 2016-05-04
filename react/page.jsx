var React = require('react');
var marked = require('marked');

var Page = React.createClass({
    getInitialState: function (){
        return {pageName: "home", pageTitle: "Home", pageContent: "Loading..."};
    },
    componentDidMount: function (){
        this.props.emitter.emit("titleChange", this.state.pageTitle);
        // this.serverRequest = $.get("/api/v1/page/"+this.props.page, function (result){
        //     //when done fetching
        //     this.setState(result);
        // }.bind(this));
    },
    componentWillUnmount: function (){
        // this.serverRequest.abort();
    },
    rawMarkup: function() {
        var rawMarkup = marked(this.state.pageContent, {sanitize: true});
        return { __html: rawMarkup };
    },
    render: function (){
        return <div className="pageContent" dangerouslySetInnerHTML={this.rawMarkup()}></div>;
    }
});

module.exports = Page;
