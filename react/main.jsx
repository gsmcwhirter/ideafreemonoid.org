var React = require('react');
var ReactDOM = require('react-dom');
var marked = require('marked');

var PageTitle = React.createClass({
    render: function (){
        return <h1>IdeaFreeMonoid&nbsp;-&nbsp;<span id="pagetitle">{this.props.pagetitle}</span></h1>;
    }
});

var UserStatus = React.createClass({
    getInitialState: function (){
        return {user: null};
    },
    onLogin: function (){
        //TODO: try to log in
        this.setState({user: "Greg"});
    },
    onLogout: function (){
        //TODO: try to log out
        this.setState({user: null});
    },
    render: function (){
        if (!this.state.user){
            return (
                <div>
                    <input type="text" name="username" placeholder="Username" />
                    <input type="password" name="password" placeholder="Password" />
                    <button onClick={this.onLogin}>Log in</button>
                </div>
            );
        }
        else {
            return (
                <div>
                    <span className="userInfo">Logged in: {this.state.user}</span>
                    <button onClick={this.onLogout}>Log out</button>
                </div>
            );
        }
    }
});

var SideBar = React.createClass({
    getInitialState: function (){
        return {about: ""};
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
                    <dt>E-Mail:</dt> <dd><a href="mailto:greg@ideafreemonoid.org">greg@ideafreemonoid.org</a></dd>
                    <dt>GitHub:</dt> <dd><a href="https://www.github.com/gsmcwhirter">https://www.github.com/gsmcwhirter</a></dd>
                    <dt>Twitter:</dt> <dd><a href="https://www.twitter.com/gsmcwhirter">https://www.twitter.com/gsmcwhirter</a></dd>
                    <dt>LinkedIn:</dt> <dd><a href="http://www.linkedin.com/in/gsmcwhirter">http://www.linkedin.com/in/gsmcwhirter</a></dd>
                </dl>
                <div className="clearfix"></div>
                <h4>About Me</h4>
                <div dangerouslySetInnerHTML={this.rawMarkup()} />
            </div>);
    }
});

ReactDOM.render(<SideBar />, document.getElementById('sidebar'));

var Menu = React.createClass({
    render: function (){
        return (
            <nav id="menu">
                <ul>
                    {this.props.pages.map(function (page){
                        return <li key={page.id}><a href={page.url}>{page.title}</a></li>;
                    })}
                </ul>
            </nav>
        );
    }
});

var Page = React.createClass({
    getInitialState: function (){
        return {pageTitle: "Home", content: "Home page data!", menu: [{id: 0, url: "/", title: "Home"}, {id: 1, url: "/blog/", title: "Blog"}, {id: 2, url:"/cv/", title: "CV"}, {id: 3, url: "/code/", title: "Portfolio"}]};
    },
    rawMarkup: function() {
        var rawMarkup = marked(this.state.content, {sanitize: true});
        return { __html: rawMarkup };
    },
    render: function (){
        return (
            <div>
                <header id="header">
                    <PageTitle pagetitle={this.state.pageTitle} />
                </header>
                <Menu pages={this.state.menu}/>
                <div id="main" role="main" dangerouslySetInnerHTML={this.rawMarkup()}>
                </div>
            </div>
        );
    }
});

ReactDOM.render(<Page />, document.getElementById("content"));
