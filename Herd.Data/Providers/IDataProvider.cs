﻿using Herd.Data.Models;

namespace Herd.Data.Providers
{
    public interface IDataProvider
    {
        // App registration
        Registration GetAppRegistration(long id);

        Registration GetAppRegistration(string instance);

        Registration CreateAppRegistration(Registration appRegistration);

        void UpdateAppRegistration(Registration appRegistration);

        // Users
        UserAccount GetUser(long id);

        UserAccount GetUser(string email);

        UserAccount CreateUser(UserAccount user);

        void UpdateUser(UserAccount user);

        // Profiles
        UserProfile GetProfile(long id);

        UserProfile CreateProfile(UserProfile profile);

        void UpdateProfile(UserProfile profile);
    }
}