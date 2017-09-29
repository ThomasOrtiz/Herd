﻿using System;
using System.Collections.Generic;
using System.Text;

namespace Herd.Logging
{
    public interface IHerdLogger
    {
        void Log(Guid? id, HerdLogLevel logLevel, string message, IEnumerable<KeyValuePair<string, string>> contextParameters = null);
    }
}
