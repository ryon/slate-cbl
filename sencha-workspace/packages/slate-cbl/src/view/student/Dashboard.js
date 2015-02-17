/*jslint browser: true, undef: true *//*global Ext*/
Ext.define('Slate.cbl.view.student.Dashboard', {
    extend: 'Ext.Component',
    xtype: 'slate-cbl-student-dashboard',
    requires:[
        'Slate.cbl.view.student.DashboardController',
        'Slate.cbl.model.ContentArea',
        'Slate.cbl.model.Competency',
        'Slate.cbl.model.ContentArea',
        'Slate.cbl.widget.Popover'
    ],

    controller: 'slate-cbl-student-dashboard',

    config: {
        contentArea: null,
        popover: {
            pointer: 'none'
        }
    },

    competenciesTpl: [
        '<tpl for="competencies">',
            '{%var level = 9%}', // TODO: real level
            '{%var studentCompletion = values.studentCompletions[parent.student.ID] || {}%}',
            '{%var percent = Math.round(100 * (studentCompletion.demonstrationsCount || 0) / values.totalDemonstrationsRequired)%}',
            '{%var isAverageLow = studentCompletion.demonstrationsAverage < values.minimumAverage && percent >= 50%}',
            '<li class="panel cbl-competency-panel cbl-level-{[level]}" data-competency="{ID}">',
                '<header class="panel-header">',
                    '<h3 class="header-title">{Descriptor}</h3>',
                '</header>',
                
                '<div class="panel-body">',
                    '<div class="cbl-progress-meter {[isAverageLow ? "is-average-low" : ""]}">',
                        '<div class="cbl-progress-bar" style="width:{[percent]}%"></div>',
                        '<div class="cbl-progress-level">L{[level]}</div>',
                        '<div class="cbl-progress-percent">{[percent]}%</div>',
                        '<div class="cbl-progress-average">{[fm.number(studentCompletion.demonstrationsAverage, "0.##")]}</div>',
                    '</div>',

    				'<div class="explainer">',
                        '<p>{Statement}</p>',
//						'<p>Here goes a sentence explaining that your average score of <strong>9.25</strong> is below the skill level needed to progress, <strong>10</strong>. This is a sentence describing what you can do to improve.</p>',
					'</div>',

                    '<ul class="cbl-skill-meter skills-unloaded"></ul>',
                '</div>',
            '</li>',
        '</tpl>'
    ],
    
    skillsTpl: [
        '<tpl for=".">',
            '<li class="cbl-skill">',
                '<h5 class="cbl-skill-name" data-descriptor="{Descriptor}" data-statement="{Statement}">{Descriptor}</h5>',
                '<ul class="cbl-skill-demos">',
                    '<tpl for="this.getDemonstrationBlocks(values)">',
                        '<li class="cbl-skill-demo <tpl if="!values.counted">cbl-skill-demo-uncounted</tpl>" <tpl if="SkillID">data-skill="{SkillID}"</tpl> <tpl if="DemonstrationID">data-demonstration="{DemonstrationID}"</tpl>>',
                            '<tpl if="Level">',
                                '{[values.Level == 0 ? "M" : values.Level]}',
                            '<tpl else>',
                                '&nbsp;',
                            '</tpl>',
                        '</li>',
                    '</tpl>',
                '</ul>',
                '<div class="cbl-skill-description"><p>{Statement}</p></div>',
//                '<div class="cbl-skill-complete-indicator cbl-level-{parent.level} is-checked">',
//                    '<svg class="check-mark-image" width="16" height="16">',
//                        '<polygon class="check-mark" points="13.824,2.043 5.869,9.997 1.975,6.104 0,8.079 5.922,14.001 15.852,4.07"/>',
//                    '</svg>',
//                '</div>',
            '</li>',
        '</tpl>',
        {
            // TODO: deduplicate this and its copy from the teacher dashboard?
            getDemonstrationBlocks: function(skill) {
                var demonstrationsRequired = skill.DemonstrationsRequired,
                    blocks, blocksLength, blockIndex, lowestBlockIndex;

                if (Ext.isArray(skill.demonstrations)) {
                    blocks = Ext.Array.map(skill.demonstrations, function(demonstration) {
                        return Ext.apply({
                            counted: demonstration.Level >= 8 // TODO: retrieve the competency level dynamically rather than hard coding to 9
                        }, demonstration);
                    });    
                } else {
                    blocks = [];
                }

                // trim lowest demonstrations
                while ((blocksLength = blocks.length) > demonstrationsRequired) {
                    for (blockIndex = 0, lowestBlockIndex = null; blockIndex < blocksLength; blockIndex++) {
                        if (lowestBlockIndex === null || blocks[blockIndex].Level < blocks[lowestBlockIndex].Level) {
                            lowestBlockIndex = blockIndex;
                        }
                    }

                    Ext.Array.splice(blocks, lowestBlockIndex, 1);
                }

                // sort counted demonstrations first
                Ext.Array.sort(blocks, function(a, b) {
                    if (a.counted && !b.counted) {
                        return -1;
                    }

                    if (!a.counted && b.counted) {
                        return 1;
                    }

                    return a.DemonstrationID > b.DemonstrationID ? 1 : -1;
                });

                // add empty blocks
                while (blocks.length < demonstrationsRequired) {
                    blocks.push({});
                }

                return blocks;
            }
        }
    ],
    
    html: [
      '<ul class="cbl-competency-panels competencies-unloaded" id="studentDashboardCompetenciesList"></ul>'  
    ],

    listeners: {
        scope: 'this',
        click: {
            fn: 'onListClick',
            element: 'el',
            delegate: '.cbl-competency-panels, .cbl-competency-panels'
/*
        },
        mouseover: {
            fn: 'onSkillNameMouseOver',
            element: 'el'
*/
        }
    },

    applyPopover: function(newPopover, oldPopover) {
        return Ext.factory(newPopover, 'Slate.cbl.widget.Popover', oldPopover);
    },

    applyContentArea: function(contentArea) {
        if (!contentArea) {
            return null;
        }

        if (contentArea.isModel) {
            return contentArea;
        }

        if (contentArea === true) {
            contentArea = {};
        }

        return Ext.create('Slate.cbl.model.ContentArea', contentArea);
    },

    updateContentArea: function(newContentArea, oldContentArea) {
        this.fireEvent('contentareachange', this, newContentArea, oldContentArea);
    },

    onListClick: function(ev, t) {
        var me = this,
            targetEl;

        if (targetEl = ev.getTarget('.cbl-skill-demo', me.el, true)) {
            me.fireEvent('democellclick', me, ev, targetEl);
        }
    },

    onSkillNameMouseOver: function(ev) {
        var me = this,
            popover = me.getPopover(),
            dashboardEl = me.el,
            targetEl;

        if (targetEl = ev.getTarget('.cbl-skill-name', dashboardEl, true)) {
            if (popover.hidden || popover.alignTarget !== targetEl) {
                popover.showBy(targetEl, 'tl-bl', [0, 42]);
                popover.setWidth(targetEl.getWidth());
                popover.update({
                    // title: targetEl.getAttribute('data-descriptor'),
                    title: null,
                    body: targetEl.getAttribute('data-statement')
                });
            }
        } else {
            popover.hide();
        }
    }
});