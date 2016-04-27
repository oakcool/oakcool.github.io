

namespace oak {
    export class MainViewModel {
        areas: KnockoutObservableArray<AreaViewModel>;
        current: KnockoutObservable<AreaViewModel>;
        test: KnockoutObservable<string>;

        constructor() {

            this.areas = ko.observableArray<AreaViewModel>();
            this.areas.push(new ProjectViewModel(this));
            var meVm = new OakcoolViewModel(this)
            this.areas.push(meVm);
            this.current = ko.observable<AreaViewModel>(meVm);
        }

        show(viewModel: AreaViewModel) {

            this.current(viewModel);

        }
    }
}
