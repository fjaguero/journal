import React, { Component } from "react";
import Remarkable from "remarkable";
import store from "store";
import logo from "./logo.svg";
import uuidv1 from "uuid/v1";
import { format } from "date-fns";
import { flow, sortBy, reverse } from "lodash/fp";
import Notifications, { notify } from "react-notify-toast";
import 'spectre.css';

import "./App.css";

const NOTIFICATION_OPTIONS = {
  timeout: 3000,
  animationDuration: 500,
  colors: {
    success: {
      color: '#FFFFFF',
      backgroundColor: '#00CD6D',
    },
    error: {
      color: '#FBEDEB',
      backgroundColor: '#E45B46',
    },
  },
}

export default class App extends React.Component {
  state = {
    text: "",
    grateful: "",
    tomorrow: "",
    highlight: {
      daily: {
        active: false,
        value: store.get('daily'),
      },
      weekly: {
        active: false,
        value: store.get('weekly'),
      },
      monthly: {
        active: false,
        value: store.get('monthly'),
      }
    },
    posts: store.get('posts'),
  }

  componentWillMount() {
    // Manage cold start
    if (store.get('posts') === undefined) {
      store.set("posts", [])
      this.setState({ posts: [] })
    }
  }

  hancleChangeHighlight = (e) => {
    const { name, value} = e.currentTarget;
    this.setState(state => ({ 
      ...state,
      highlight: {
        ...state.highlight,
        [name]: {
          active: !state.highlight[name].active,
          value: state.highlight[name].value
        }
      }})
    );
  }

  handleChange = (e) => {
    const { name, value} = e.currentTarget;
    this.setState({ [name]: value });
  }

  getMarkup = (text) => {
    const md = new Remarkable();
    return { __html: md.render(text) };
  }

  handleSavePost = (e) => {
    e.preventDefault();
    const { text, grateful } = this.state;

    if (!text) {
      alert('Write a day review first')
      return;
    }

    if (!grateful) {
      alert("Write about what you are grateful for");
      return;
    }

    // create a new item with unique id
    const newPost = {
      id: uuidv1(),
      createdAt: new Date(),
      text,
      grateful,
    };

    const posts = [...this.state.posts, newPost];
    store.set("posts", posts);

    // update state with new list, reset the new item input
    this.setState({
      posts,
      text: "",
      grateful: "",
    });

    notify.show("Entry saved", "success");
  };

  updateObjectives = (e) => {
    const { weekly, monthly } = this.state;
    e.preventDefault();

    if (!weekly || !monthly) {
      alert('Set both the monthly and weekly objectives')
      return;
    }

    store.set("weekly", weekly);
    store.set("monthly", monthly);
    notify.show("Objectives updated", "success" );
  }

  renderNotes = () => {
    const { posts } = this.state;
    const today = new Date();

    const sortedPosts = flow(
      sortBy('createdAt'),
      reverse,
    )(posts);

    // TODO: Group same-day notes
    return posts ? sortedPosts.map(p => {
      return (
        <div className="note" key={p.id}>
          <h3>{format(p.createdAt, "cccc dd/MM")}</h3>
          <div>
            <h4>My day was like:</h4>
            <p dangerouslySetInnerHTML={this.getMarkup(p.text)} />
          </div>
          <div>
            <h4>I was grateful for:</h4>
            <p dangerouslySetInnerHTML={this.getMarkup(p.grateful)} />
          </div>
        </div>
      )
    }) : null;
  }

  renderHeader = () => (
    <div className="header">
      <h1>{format(new Date(), "cccc dd")}</h1>
    </div>
  )

  renderList = () => {
    const $notes = this.renderNotes();

    return (
      <div>
        <h2>Diary</h2>
        <div className="notes">
          {$notes}
        </div>
        <button className="btn" onClick={() => store.clearAll()}>
          Clear
        </button>
      </div>
    )
  }
    

  renderHighlight = (type) => {
    return <div className="highlight-block">
        <p className="highlight-block__title">{type}</p>
        <div className="form-group">
          <label className="form-checkbox">
            <input 
              type="checkbox" 
              name={type} 
              onChange={this.hancleChangeHighlight} 
              value={this.state.highlight[type].active}
            />
            <i className="form-icon" /> {this.state.highlight[type].value}
          </label>
        </div>
      </div>;
  }

  renderObjectives = () => {
    const { daily, monthly, weekly } = this.state;

    return (
      <div>
          <label>Monthly objective:</label>
          <input
            type="text"
            name="monthly"
            value={monthly}
            onChange={this.handleChange}
          />
        <p>
          <label>Weekly objective:</label>
          <input
            type="text"
            name="weekly"
            value={weekly}
            onChange={this.handleChange}
          />
        </p>
      </div>
    )
  }

  render() {
    const $header = this.renderHeader();
    const $list = this.renderList();
    const $objectives = this.renderObjectives();

    return (
    <div className="app">
        <Notifications options={NOTIFICATION_OPTIONS} />
        <div className=" container">
          {$header}
          <div className="columns">
            <div className="column col-3">
              <h4>Highlight</h4>
              {this.renderHighlight('daily')}
              {this.renderHighlight('weekly')}
              {this.renderHighlight('monthly')}
            </div>
            <div className="column col-9">
              <div className="input">
                <h2>Day review</h2>
                <textarea
                  id="markdown-text"
                  name="text"
                  cols="60"
                  rows="8"
                  className="textarea day"
                  placeholder="Write about your day..."
                  onChange={this.handleChange}
                  value={this.state.text}
                />
                <div>
                  <h2>Gratefulness</h2>
                  <textarea
                    id="markdown-grateful"
                    name="grateful"
                    cols="60"
                    rows="5"
                    className="textarea day"
                    placeholder="What are you grateful for?"
                    onChange={this.handleChange}
                    value={this.state.grateful} 
                  />
                  <h2>Tomorrow's Highlight</h2>
                  <textarea
                    id="tomorrow"
                    name="tomorrow"
                    rows="1"
                    className="textarea day"
                    placeholder="What are you focusing on?"
                    onChange={this.handleChange}
                    value={this.state.tomorrow} 
                  />
                  <button type="submit" className="btn btn-primary" onClick={this.handleSavePost}>
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
      
  }
}
