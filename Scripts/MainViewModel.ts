import ko = require('knockout');
import vm = require('AreaViewModel');
import ovm = require('OakcoolViewModel');
import pvm = require('ProjectViewModel');

export class MainViewModel {
    areas: KnockoutObservableArray<vm.AreaViewModel>;
    current: KnockoutObservable<vm.AreaViewModel>;
    test: KnockoutObservable<string>;

    constructor() {
        
        this.areas = ko.observableArray<vm.AreaViewModel>();
        this.areas.push(new pvm.ProjectViewModel(this));
        var meVm = new ovm.OakcoolViewModel(this)
        this.areas.push(meVm);
        this.current = ko.observable<vm.AreaViewModel>(meVm);
    }

    show(viewModel: vm.AreaViewModel) {

        this.current(viewModel);
        
    }
}
