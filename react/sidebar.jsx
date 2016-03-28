var React = require('react');
var marked = require('marked');

var UserStatus = require('./userstatus.jsx');

var SideBar = React.createClass({
    getInitialState: function (){
        //TODO
        return {about: "", email: "greg@ideafreemonoi.org", github: "gsmcwhirter", twitter: "gsmcwhirter", linkedin: "gsmcwhirter"};
    },
    rawMarkup: function() {
        var rawMarkup = marked(this.state.about, {sanitize: true});
        return { __html: rawMarkup };
    },
    render: function (){
        return (
            <div>
                <UserStatus />
                <img className="picture" src="/images/picture2.png" alt="photo of gregory mcwhirter" />
                <h3 className="header top">Gregory McWhirter</h3>
                <dl>
                    <dt>E-Mail:</dt> <dd><a href="mailto:{this.state.email}">{this.state.email}</a></dd>
                    <dt>GitHub:</dt> <dd><a href="https://www.github.com/{this.state.github}">{this.state.github}</a></dd>
                    <dt>Twitter:</dt> <dd><a href="https://www.twitter.com/{this.state.twitter}">@{this.state.twitter}</a></dd>
                    <dt>LinkedIn:</dt> <dd><a href="http://www.linkedin.com/in/{this.state.linkedin}">{this.state.linkedin}</a></dd>
                </dl>
                <div className="clearfix"></div>
                <h4>About Me</h4>
                <div dangerouslySetInnerHTML={this.rawMarkup()} />
            </div>);
    }
});

module.exports = SideBar;
