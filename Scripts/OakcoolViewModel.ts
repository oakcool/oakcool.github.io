
namespace oak {
    export class OakcoolViewModel extends AreaViewModel {
        content: string;
        constructor(main: any) {
            super(main);
            this.isMe(true);
            this.name("mateus carvalho");
            this.subName("oakcool");
            this.action = this.doAction;
            this.image("Content/mateusthoughtful.png");

            this.calculateHeight();

        }

        doAction() {
            this.main.show(this);

        }
    }
}