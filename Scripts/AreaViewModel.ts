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
        areaContent: KnockoutObservable<string>;
        showContent: KnockoutObservable<boolean>;

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
            this.areaContent = ko.observable<string>();
            this.showContent = ko.observable<boolean>(false);
        }

        calculateHeight() {
            var innerHeight = $("body").innerHeight();
            var imageHeight = (innerHeight * this.imageDesiredHeightRatio());
            this.imageHeight(imageHeight);
            this.imageMarginTop((innerHeight - imageHeight));

        }
    }
}