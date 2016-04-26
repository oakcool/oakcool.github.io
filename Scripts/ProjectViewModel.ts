import ko = require('knockout');
import vm = require('AreaViewModel');

export class ProjectViewModel extends vm.AreaViewModel {
    content: string;
    constructor(main: any) {
        super(main);        
        this.name("projects");
        this.subName("oakideas");
        this.action = this.doAction;
        this.image("Content/oakideasnew.png");
        this.imageDesiredHeightRatio(.4);

        this.calculateHeight();
        
    }

    doAction() {        
        this.main.show(this);

    }
}