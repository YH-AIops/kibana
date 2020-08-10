import jetbrains.buildServer.configs.kotlin.v2019_2.*
import jetbrains.buildServer.configs.kotlin.v2019_2.buildSteps.script

class OssVisualRegression(val build: BuildType) : BuildType({
    id("OssVisualRegression")
    name = "Visual Regression"
    paused = true

    steps {
        script {
            scriptContent = """
                #!/bin/bash

                if [[ -d "/home/agent/.kibana/node_modules" ]]; then
                  echo 'Using node_modules cache'
                  mv /home/agent/.kibana/node_modules .
                fi

                export CI_PARALLEL_PROCESS_NUMBER=1
                export JOB=oss-visualRegression
                export CI=true
                export GCS_UPLOAD_PREFIX=ehwihsihfiashdhfshfso

                mv /home/agent/work/kibana-build-oss/kibana-8.0.0-SNAPSHOT-linux-x86_64/* /home/agent/work/kibana-build-oss/

                source ./src/dev/ci_setup/setup.sh

                node scripts/functional_tests \
                  --debug --bail \
                  --kibana-install-dir "/home/agent/work/kibana-build-oss/" \
                  --config test/visual_regression/config.ts;
            """.trimIndent()
        }
    }

    features {
        feature {
            type = "xml-report-plugin"
            param("xmlReportParsing.reportType", "junit")
            param("xmlReportParsing.reportDirs", "target/**/TEST-*.xml")
        }
    }

     dependencies {
         dependency(build) {
             snapshot {
             }

             artifacts {
                 artifactRules = "+:kibana-oss.tar.gz!** => /home/agent/work/kibana-build-oss"
             }
         }
     }
})
