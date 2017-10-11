﻿using Herd.Core;
using Herd.Data.Models;
using System;
using System.Linq;

namespace Herd.Business
{
    public static class Extensions
    {
        public static bool PasswordIs(this UserAccount user, string plainTextPassword) => user.Security.SaltedPassword == plainTextPassword.Hashed(user.Security.SaltKey);

        public static string Hashed(this string passwordPlainText, long saltKey)
        {
            var random = new Random((int)(saltKey % int.MaxValue));
            var mungedPassword = new string($"{passwordPlainText}{saltKey}".OrderBy(c => random.Next()).ToArray());
            return mungedPassword.Hashed();
        }
    }
}