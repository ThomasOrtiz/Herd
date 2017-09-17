﻿using Mastonet;
using Mastonet.Entities;
using Herd.Data.Models;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace Herd.Business
{
    public interface IMastodonApiWrapper
    {
        string HostInstance { get; set; }
        string UserApiToken { get; set; }

        void SetAuthClientInstance(string instance);
        Task<Account> GetUserAccount();
        Task<string> GetOAuthUrl(string redirectURL, string instance);
        Task<bool> LoginToApp(string username, string instance);
        Task<bool> LoginWithOAuthToken(string instance, string userApiToken);
    }

    public class MastodonApiWrapper : IMastodonApiWrapper
    {
        private AuthenticationClient _authClient = null;
        private MastodonClient _mastodonClient = null;

        public string HostInstance { get; set; }
        public string UserApiToken { get; set; }

        #region constructors
        public MastodonApiWrapper(string hostInstance)
            : this(hostInstance, null)
        {
        }

        // TODO switch userApiToken stuff to Auth instead of string
        public MastodonApiWrapper(string hostInstance, string userApiToken)
        {
            HostInstance = hostInstance;
            UserApiToken = userApiToken;

            _authClient = new AuthenticationClient(HostInstance);
        }

        // This has to wait on the login to finish
        public void SetupMastodonClient(AppRegistration app, Auth userAuthToken)
        {
            _mastodonClient= new MastodonClient(_authClient.AppRegistration, userAuthToken);
            //InitializeTimeline();
        }
        #endregion 

        public async Task<Account> GetUserAccount()
        {
            var currentUser = await _mastodonClient.GetCurrentUser();
            return currentUser;
        }

        public async Task<string> GetOAuthUrl(string redirectURL, string instance)
        {
            _authClient.AppRegistration = await GetAppRegistrationAsync(instance);
            // we can use _authClient.AppRegistration.RedirectUri as this is set my the API wrapper
            // On localhost it does set the correct URL BUT I'm not sure about production.
            // Probably best to leave it as a hard coded redirectUrl
            return _authClient.OAuthUrl(redirectURL);
        }

        /**
         * Attempt to Login to the app with a username/instance.
         */
        public async Task<bool> LoginToApp(string username, string instance)
        {
            try // to get the user's cached oAuth token
            {
                HerdUserDataModel user = HerdApp.Instance.Data.GetUser(2); // TODO: CHANGE THIS TO GET USER BASED OFF USERNAME/INSTANCE
                if (string.IsNullOrEmpty(user.ApiAccessToken))
                {
                    throw new Exception("No api token");
                }
                this.UserApiToken = user.ApiAccessToken;
                return await LoginWithOAuthToken(instance, user.ApiAccessToken);
            }
            catch (Exception) // User doesn't exist so we have to make it and get authentication
            {
                return false;
            }
        }

        /**
         * Connect to the mastodon client using the user supplied OAuth token.
         */
        public async Task<bool> LoginWithOAuthToken(string instance, string userApiToken)
        {
            this.UserApiToken = userApiToken;
            SetAuthClientInstance(instance);
            Auth auth = await _authClient.ConnectWithCode(userApiToken);
            _mastodonClient = new MastodonClient(_authClient.AppRegistration, auth);
            return true;
        }


        //private void HomeStream_OnUpdate(object sender, StreamUpdateEventArgs e)
        //{
        //    Home.Insert(0, e.Status);
        //}

        #region Helper methods
        public async void SetAuthClientInstance(string instance)
        {
            _authClient = new AuthenticationClient(await GetAppRegistrationAsync(instance));
        }

        /**
         * Try to get a cached app registration, if it doesn't exist make one.
         */
        private async Task<AppRegistration> GetAppRegistrationAsync(string instance)
        {
            try // to get an existing registration from the database
            {
                HerdAppRegistrationDataModel herdRegistration = HerdApp.Instance.Data.GetAppRegistration(instance);
                AppRegistration registration = new AppRegistration
                {
                    Id = (int)herdRegistration.ID,
                    RedirectUri = herdRegistration.RedirectUri,
                    ClientId = herdRegistration.ClientId,
                    ClientSecret = herdRegistration.ClientSecret,
                    Instance = herdRegistration.Instance,
                    Scope = Scope.Read | Scope.Write | Scope.Follow
                };
                return registration;
            }
            catch (Exception) // if the registration isn't saved in the db then just create it.
            {
                return await CreateAppRegistration();
            }
        }

        //private async void InitializeTimeline()
        //{
        //    _authClient = new AuthenticationClient(await GetAppRegistrationAsync(instance));
        //}

        /**
         * Create the app registration by calling the mastodon api.
         */
        private async Task<AppRegistration> CreateAppRegistration()
        {
            _authClient.AppRegistration = await _authClient.CreateApp("Herd", Scope.Read | Scope.Write | Scope.Follow);
            SaveAppRegistration(_authClient.AppRegistration);
            return _authClient.AppRegistration;
        }

        /**
         * Save the app registration to the Herd database.
         */
        private void SaveAppRegistration(AppRegistration mastodonAppRegistration)
        {
            HerdAppRegistrationDataModel registration = new HerdAppRegistrationDataModel
            {
                ID = mastodonAppRegistration.Id,
                RedirectUri = mastodonAppRegistration.RedirectUri,
                ClientId = mastodonAppRegistration.ClientId,
                ClientSecret = mastodonAppRegistration.ClientSecret,
                Instance = mastodonAppRegistration.Instance,
            };
            HerdApp.Instance.Data.UpdateAppRegistration(registration);
        }
        #endregion
    }
}
