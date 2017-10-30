﻿import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { NotificationsService } from "angular2-notifications";
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from "rxjs/Observable";

import { AccountService, EventAlertService, StatusService } from "../../services";
import { Account, Status } from '../../models/mastodon';
import { Storage, EventAlertEnum } from '../../models';
import { BsModalComponent } from "ng2-bs3-modal/ng2-bs3-modal";
import { TabsetComponent } from "ngx-bootstrap";
import { Subscription } from "rxjs/Rx";


@Component({
    selector: 'profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.css']
})
export class ProfilePage implements OnInit, AfterViewInit {
    @ViewChild('staticTabs') staticTabs: TabsetComponent;
    @ViewChild('specificStatusModal') specificStatusModal: BsModalComponent;
    @ViewChild('replyStatusModal') replyStatusModal: BsModalComponent;

    statusId: number;
    specificStatus: Status;
    replyStatus: Status;

    account: Account;
    userPosts: Status[] = []; // List of posts from this user
    following: Account[] = [];
    followers: Account[] = [];

    isFollowing: boolean = false;
    followUnfollowText: string = "Following";

    loading: boolean = false;

    constructor(
        private accountService: AccountService,
        private eventAlertService: EventAlertService,
        private localStorage: Storage,
        private route: ActivatedRoute,
        private statusService: StatusService,
        private toastService: NotificationsService) {
    }

    /**
     * Set up subscriptions for alerts
     */
    ngOnInit() {
        // Monitor Param map 
        this.route.paramMap
            .switchMap((params: ParamMap) => Observable.of(params.get('id') || "-1"))
            .subscribe(userID => {
                this.getUserAccount(userID);
                this.getFollowing(userID);
                this.getFollowers(userID);
                this.getMostRecentUserPosts(userID);
            });

        // Setup subscription to update modals on status click
        this.eventAlertService.getMessage().subscribe(event => {
            switch (event.eventType) {
                case EventAlertEnum.UPDATE_SPECIFIC_STATUS: {
                    let statusID: string = event.statusID;
                    this.updateSpecificStatus(statusID);
                    break;
                }
                case EventAlertEnum.UPDATE_REPLY_STATUS: {
                    let statusID: string = event.statusID;
                    this.updateReplyStatusModal(statusID);
                    break;
                }
                case EventAlertEnum.UPDATE_FOLLOWING_AND_FOLLOWERS: {
                    this.getFollowers(this.account.MastodonUserId);
                    this.getFollowing(this.account.MastodonUserId);
                    break;
                }
            }
        });
    }

    /**
     * Update default tab
     */
    ngAfterViewInit() {
        this.route.queryParams
            .subscribe(params => {
                let tabIndex: number = params['tabIndex'] || 0;
                setTimeout(() => this.staticTabs.tabs[tabIndex].active = true);
            });
    }

    isCurrentUser(): boolean {
        let currentUser = JSON.parse(this.localStorage.getItem('currentUser'));
        let userID = currentUser.MastodonConnection.MastodonUserID;
        if (userID === this.account.MastodonUserId) {
            return true;
        }
        return false;
    }

    togglefollow(): void {
        this.accountService.followUser(String(this.account.MastodonUserId), !this.isFollowing)
            .subscribe(response => {
                this.isFollowing = !this.isFollowing;
                this.eventAlertService.addEvent(EventAlertEnum.UPDATE_FOLLOWING_AND_FOLLOWERS);
                this.toastService.success("Successfully", "changed relationship.");
            }, error => {
                this.toastService.error(error.error);
            });
    }

    /**
     * Given a userID, get that Users account
     * @param userId
     */
    getUserAccount(userID: string) {
        this.loading = true;
        let progress = this.toastService.info("Retrieving", "account information ...", { timeOut: 0 });
        this.accountService.search({ mastodonUserID: userID })
            .map(response => response[0] as Account)
            .finally(() => this.loading = false)
            .subscribe(account => {
                this.toastService.remove(progress.id);
                this.account = account;
                if (this.account.IsFollowedByActiveUser) {
                    this.isFollowing = true;
                }
            }, error => {
                this.toastService.error("Error", error.error);
            });
    }

    /**
     * Get the posts that this user has made
     * @param userID
     */
    getMostRecentUserPosts(userID: string) {
        this.statusService.search({ authorMastodonUserID: userID })
            .subscribe(feed => {
                this.userPosts = feed;
            }, error => {
                this.toastService.error("Error", error.error);
            });
    }

    /**
     * Get the follows of this user
     * @param userID
     */
    getFollowers(userID: string) {
        this.accountService.search({ followsMastodonUserID: userID, includeFollowsActiveUser: true })
            .subscribe(users => {
                this.followers = users;
            });
    }

    /**
     * Get who this user is following
     * @param userID
     */
    getFollowing(userID: string) {
        this.accountService.search({ followedByMastodonUserID: userID, includeFollowedByActiveUser: true })
            .subscribe(users => {
                this.following = users;
            });
    }

    updateSpecificStatus(statusId: string): void {
        this.loading = true;
        let progress = this.toastService.info("Retrieving", "status info ...");
        this.statusService.search({ postID: statusId, includeAncestors: true, includeDescendants: true })
            .map(posts => posts[0] as Status)
            .finally(() => this.loading = false)
            .subscribe(data => {
                this.toastService.remove(progress.id);
                this.specificStatus = data;
                this.specificStatus.Ancestors = data.Ancestors;
                this.specificStatus.Descendants = data.Descendants;
                this.specificStatusModal.open();
                this.toastService.success("Finished", "retrieving status.")
            }, error => {
                this.toastService.error("Error", error.error);
            });
    }

    updateReplyStatusModal(statusId: string): void {
        this.loading = true;
        let progress = this.toastService.info("Retrieving", "status info ...");
        this.statusService.search({ postID: statusId, includeAncestors: false, includeDescendants: false })
            .map(posts => posts[0] as Status)
            .finally(() => this.loading = false)
            .subscribe(data => {
                this.toastService.remove(progress.id);
                this.replyStatus = data;
                this.replyStatusModal.open();
                this.toastService.success("Finished", "retrieving status.")
            }, error => {
                this.toastService.error("Error", error.error);
            });
    }
}
