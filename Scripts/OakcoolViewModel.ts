
namespace oak {
    export class OakcoolViewModel extends AreaViewModel {
        
        constructor(main: any) {
            super(main);
            this.isMe(true);
            this.name("mateus carvalho");
            this.subName("oakcool");
            this.action = this.doAction;
            this.image("Content/mateusthoughtful.png");

            this.calculateHeight();

            this.areaContent("<p><h2><strong>oak</strong>cool</h2></p><p>How to briefely describe me? well I really have never gotten that right, but think of a guy that is always <del>thinking, observing, listening, loving,</del> in outter space and enjoying life as much as he can, who also codes, plays soccer, cooks, <strong><em><ins>and most importantly is a husband and a dad</ins></em></strong>.</p><p>Yep thats <strong>me</strong> right there.</p><p><strong>&lt; KeepCoding /&gt;</strong><p>");

        }

        doAction() {            
            this.main.show(this);
            this.showContent(true);
        }
    }
}