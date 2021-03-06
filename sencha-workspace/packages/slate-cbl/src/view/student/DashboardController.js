/*jslint browser: true, undef: true *//*global Ext,Slate*/
Ext.define('Slate.cbl.view.student.DashboardController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.slate-cbl-student-dashboard',
    requires: [
        'Slate.cbl.model.Student',
        'Slate.cbl.model.Competency',
        'Slate.cbl.view.student.skill.OverviewWindow'
    ],

    config: {
        id: 'slate-cbl-student-dashboard', // workaround for http://www.sencha.com/forum/showthread.php?290043-5.0.1-destroying-a-view-with-ViewController-attached-disables-listen-..-handlers
        control: {
            '#': {
//                contentareachange: 'refresh',
//                progressrowclick: 'onProgressRowClick',
                democellclick: 'onDemoCellClick',
                render: 'onComponentRender'
            }
        }
    },

    // lifecycle overrides
    init: function() {
        var me = this;

        Ext.create('Ext.data.Store', {
            storeId: 'cbl-competencies-loaded',
            model: 'Slate.cbl.model.Competency'
        });
    },


    //event handlers
    onComponentRender: function(dashboardView) {
        var me = this,
            studentDashboardCompetenciesList = dashboardView.el,
            /* HACK: what's the right way to get the recent progress... also why do we use down with an id above? */
            studentDashboardRecentProgress = Ext.get('studentDashboardRecentProgress'), // todo: move this to Site.page.Student script
            student = dashboardView.getStudent(),
            contentArea = dashboardView.getContentArea(),
            competenciesStore = Ext.getStore('cbl-competencies-loaded'),
            competenciesTpl = Ext.XTemplate.getTpl(me.view, 'competenciesTpl'),
            recentProgressTpl = Ext.XTemplate.getTpl(me.view, 'recentProgressTpl');

        if (!student || !contentArea) {
            return;
        }

        // TODO: recent progress should be its own component
        Slate.cbl.API.getRecentProgress(student.getId(), contentArea.get('Code'), function(progress) {
            progress = Ext.isArray(progress) ? progress : [];
            
            recentProgressTpl.overwrite(studentDashboardRecentProgress, {
                progress: progress
            });
        });
        
        // empty competencies list
        studentDashboardCompetenciesList.empty();
        studentDashboardCompetenciesList.removeCls('competencies-unloaded').addCls('competencies-loading');

        contentArea.getCompetenciesForStudents([student.getId()], function(competencies) {
            var competenciesLength = competencies.length,
                competencyIndex = 0,
                competency, skillsList;

            if(!competenciesStore.isLoaded()) {
                competenciesStore.loadRawData(competencies);
            }

            competenciesTpl.overwrite(studentDashboardCompetenciesList, {
                student: student.getData(),
                competencies: competencies
            });

            studentDashboardCompetenciesList.removeCls('competencies-loading').addCls('competencies-loaded');

            for (; competencyIndex < competenciesLength; competencyIndex++) {
                competency = Ext.create('Slate.cbl.model.Competency', competencies[competencyIndex]);
                skillsList = studentDashboardCompetenciesList.down('.cbl-competency-panel[data-competency="'+competency.getId()+'"] .cbl-skill-meter');
                me.loadSkills(student, competency, skillsList);
            }
        });
    },

    onDemoCellClick: function(dashboardView, ev, targetEl) {
        Ext.create('Slate.cbl.view.student.skill.OverviewWindow', {
            autoShow: true,
            animateTarget: targetEl,

            student: dashboardView.getStudent().getId(),
            competency: targetEl.up('ul.cbl-skill-demos').up('li.cbl-competency-panel').getAttribute('data-competency'),
            skill: targetEl.up('ul.cbl-skill-demos').getAttribute('data-skill'),
            demonstration: targetEl.getAttribute('data-demonstration')
        });
    },
    
    // protected methods
    loadSkills: function(student, competency, skillsList) {
        var me = this,
            skillsTpl = Ext.XTemplate.getTpl(me.view, 'skillsTpl'),
            skills, demonstrations, _renderSkills;

        skillsList.removeCls('skills-unloaded').addCls('skills-loading');

        _renderSkills = function() {
            var demonstrationsLength = demonstrations.length, demonstrationIndex = 0, demonstration, skill;
            // group demonstrations by skill
            for (; demonstrationIndex < demonstrationsLength; demonstrationIndex++) {
                demonstration = demonstrations[demonstrationIndex];
                skill = skills.get(demonstration.SkillID);

                if (!skill.demonstrations) {
                    skill.demonstrations = [];
                }

                skill.demonstrations.push(demonstration);
            }


            skillsTpl.overwrite(skillsList, skills.items);
            skillsList.removeCls('skills-loading').addCls('skills-loaded');
        };

        competency.getDemonstrationsForStudents([student.getId()], function(loadedDemonstrations) {
            demonstrations = loadedDemonstrations;
            
            if (skills) {
                _renderSkills();
            }
        });


        competency.withSkills(function(loadedSkills) {
            skills = loadedSkills;
            
            if (demonstrations) {
                _renderSkills();
            }
        });
    }
});
