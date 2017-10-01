﻿import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { AlertService } from '../../services/alert.service';
import { AuthenticationService } from '../../services/authentication.service';
import { StorageService } from '../../models/Storage'

@Component({
    selector: 'instance-picker',
    templateUrl: './instance-picker.component.html',
})
export class InstancePickerComponent {
    model: any = {};
    loading = false;
    oAuthUrl: string;
    registrationID: number;

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private localStorage: StorageService) { }

    getOAuthToken() {
        this.loading = true;
        this.authenticationService.getRegistrationId(this.model.instance)
            .finally(() => this.loading = false)
            .subscribe(body => {
                this.registrationID = body.Registration.ID;
                this.authenticationService.getOAuthUrl(this.registrationID)
                    .finally(() => this.loading = false)
                    .subscribe(body => {
                        this.oAuthUrl = body.URL
                        window.open(this.oAuthUrl, '_blank').focus();
                    }, error => {
                        this.alertService.error(error.error);
                    });
            }, error => {
                this.alertService.error(error.error);
            });
    }

    submitOAuthToken() {
        this.loading = true;
        this.authenticationService.submitOAuthToken(this.model.oAuthToken, this.registrationID)
            .finally(() => this.loading = false)
            .subscribe(data => {
                this.alertService.success("Successfully linked with " + this.model.instance, true);
                this.localStorage.setItem('connectedToMastodon', true);
                this.router.navigateByUrl('/home');
            }, error => {
                this.alertService.error(error.error);
            });
    }
}
