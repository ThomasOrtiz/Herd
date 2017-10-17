﻿using System;
using System.Collections.Generic;

namespace Herd.Business.Models.Entities
{
    public class MastodonPost
    {
        // Core properties
        public MastodonUser Author { get; set; }
        public string Content { get; set; }
        public DateTime CreatedOnUTC { get; set; }
        public int FavouritesCount { get; set; }
        public long Id { get; set; }
        public long? InReplyToPostId { get; set; }
        public bool? IsFavourited { get; set; }
        public bool? IsReblogged { get; set; }
        public bool? IsSensitive { get; set; }
        public int ReblogCount { get; set; }
        public string SpoilerText { get; set; }
        public MastodonPostVisibility Visibility { get; set; }

        // Extra "context" properties
        public List<MastodonPost> Ancestors { get; set; }
        public List<MastodonPost> Descendants { get; set; }

        // String versions of ids
        public string IdString { get; set; }
        public string InReplyToPostIdString { get; set; }
    }
}