
namespace oak {
    export class ProjectViewModel extends AreaViewModel {
        
        constructor(main: any) {
            super(main);
            this.name("projects");
            this.subName("oakideas");
            this.action = this.doAction;
            this.image("Content/oakideasnew.png");
            this.imageDesiredHeightRatio(.4);

            this.areaContent("<p><h2><strong>oak</strong>ideas</h2></p><p>Here are some of the public brain dumps.</p><p> I have much more that has not been aproved for public consumption yet.</p><p>Each and every project goes through an extensive process of re-evaluation, re-iteration, and pondering (<small><abbr class='initialism' title='Also Known As'>AKA</abbr> procrastination</small>) before it makes out into public eye.</p><p>Please feel free to tap in where you feel like.</p><p> <a href='https://github.com/oakcool?tab=repositories'><strong>see more... expect more</strong></a></p>");

            this.calculateHeight();

            

        }

        doAction() {
            this.main.show(this);
            this.showContent(true);
        }
    }
}