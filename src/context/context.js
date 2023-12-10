import React, { useState, useEffect, createContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ show: false, msg: "" });
  const toggleError = (show = false, msg = "") => {
    setErrors({ show, msg });
  };

  //check for remaining requests
  const checkRequests = async () => {
    try {
      const resp = await axios("https://api.github.com/rate_limit");
      let remaining = resp.data.rate.remaining;
      setRequests(remaining);
      if (remaining === 0) {
        toggleError(true, "you exceeded hourly limit!");
      }
    } catch (error) {}
  };

  useEffect(() => {
    checkRequests();
  }, [githubUser]);

  //get user info

  const getTheUser = async (user) => {
    try {
      toggleError();
      setLoading(true);
      const resp = await axios(`https://api.github.com/users/${user}`);
      setGithubUser(resp.data);
      if (resp) {
        await Promise.allSettled([
          axios(`https://api.github.com/users/${user}/repos?per_page=100`),
          axios(`https://api.github.com/users/${user}/followers?per_page=100`),
        ]).then((result) => {
          const [repos, followers] = result;
          if (repos.status === "fulfilled") {
            setRepos(repos.value.data);
          }
          if (followers.status === "fulfilled") {
            setFollowers(followers.value.data);
          }
        });
      }
      setLoading(false);
      checkRequests();
    } catch (error) {
      toggleError(true, "username incorrect");
      setLoading(false);
    }
  };

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        loading,
        requests,
        errors,
        getTheUser,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
