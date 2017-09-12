import { Component, OnInit } from '@angular/core';
import { MastodonService } from '../shared/services/mastodon.service';

@Component({
    selector: 'home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    randomInt: number;
    
    constructor(private mastodonService: MastodonService) {
    }

    ngOnInit() {
        console.log("Getting random number");
        this.mastodonService.getRandomNumber().then(randomNum => {
            console.log("Random Number", randomNum);
            this.randomInt = randomNum.numero;
        })
    }
}
