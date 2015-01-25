#! /usr/bin/env python
# -*- coding: utf-8 -*-

import os, subprocess;

#==== global values. ===================================================================================================

RtPth = os.path.dirname(__file__) + '/../';

#=======================================================================================================================

'''
  compile files from scss to css.
'''
def SCSS2CSS () :
  CmdPth = '/home/rzfang/Tool/sassc';
  IptFlPths = ['SRC/base.scss', 'SRC/style1.scss']; # 'IptFlPths' = Input File Paths.
  OptFdPth = 'WEB/www/resource/'; # 'OptFdPth' = Output File Path.

  for i in IptFlPths :
    IptFlNm = os.path.basename(i);
    OptFlNm = OptFdPth + IptFlNm.replace('.scss', '.css');
    Cmd = [CmdPth, '-t', 'compressed', i, OptFlNm];

    subprocess.call(Cmd);

    print ' '.join(Cmd);

#==== man process. =====================================================================================================

os.chdir(RtPth); # change current path of process.

print 'work on ' + os.getcwd();

SCSS2CSS();

#=======================================================================================================================