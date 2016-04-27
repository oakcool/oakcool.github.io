
namespace oak {
    export class ProjectViewModel extends AreaViewModel {
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
}