/// <reference path="typings/knockout/knockout.d.ts" />

namespace oak {

    export class AreaViewModel {
        name: KnockoutObservable<string>;
        subName: KnockoutObservable<string>;
        isMe: KnockoutObservable<boolean>;
        action: any;
        image: KnockoutObservable<string>;
        imageDesiredHeightRatio: KnockoutObservable<number>;
        imageHeight: KnockoutObservable<number>;
        imageWidth: KnockoutObservable<number>;
        imageMarginTop: KnockoutObservable<number>;
        main: any;

        constructor(vm: any) {
            this.main = vm;
            this.isMe = ko.observable<boolean>(false);
            this.name = ko.observable<string>("");
            this.subName = ko.observable<string>("");
            this.action = {};
            this.image = ko.observable<string>("");
            this.imageDesiredHeightRatio = ko.observable<number>(.7);
            this.imageHeight = ko.observable<number>();
            this.imageWidth = ko.observable<number>();
            this.imageMarginTop = ko.observable<number>();


        }

        calculateHeight() {
            var innerHeight = $("body").innerHeight();
            var imageHeight = (innerHeight * this.imageDesiredHeightRatio());
            this.imageHeight(imageHeight);
            this.imageMarginTop((innerHeight - imageHeight));

        }
    }
}